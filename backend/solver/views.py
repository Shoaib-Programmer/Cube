from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
import json
import kociemba
import time
from typing import List, Dict, Tuple
from pydantic import BaseModel, ValidationError, field_validator
from .models import CubeSolve

# Pydantic Models


class CubeFace(BaseModel):
    face: List[List[int]]

    @field_validator("face")
    def check_face_structure(cls, v):
        if not (
            isinstance(v, list)
            and len(v) == 3
            and all(isinstance(row, list) and len(row) == 3 for row in v)
        ):
            raise ValueError("Face must be a 3x3 list of lists of integers")
        if not all(isinstance(item, int) for row in v for item in row):
            raise ValueError("All elements in face must be integers")
        return v


class CubeRequestBody(BaseModel):
    cube: List[List[List[int]]]

    @field_validator("cube")
    def check_cube_structure(cls, v):
        if not (isinstance(v, list) and len(v) == 6):
            raise ValueError("Cube must be a list of 6 faces")
        for face_data in v:
            if not (
                isinstance(face_data, list)
                and len(face_data) == 3
                and all(isinstance(row, list) and len(row) == 3 for row in face_data)
            ):
                raise ValueError("Each face must be a 3x3 list of lists of integers")
            if not all(isinstance(item, int) for row in face_data for item in row):
                raise ValueError("All elements in faces must be integers")
        return v


def cube_array_to_facelet_string(cube_array: List[List[List[int]]]) -> str:
    """
    Convert 3D cube array to kociemba facelet string format.

    cube_array: List of 6 faces, each face is 3x3 array
    Face order: [Up, Right, Front, Down, Left, Back]

    Kociemba expects: UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
    Each face in order: U(0-8), R(9-17), F(18-26), D(27-35), L(36-44), B(45-53)
    """

    # Color mapping: numbers to kociemba color letters
    color_map: Dict[int, str] = {
        0: "U",  # White (Up)
        1: "R",  # Red (Right)
        2: "F",  # Green (Front)
        3: "D",  # Yellow (Down)
        4: "L",  # Orange (Left)
        5: "B",  # Blue (Back)
    }

    facelet_string: str = ""

    # Process each face in kociemba order: U, R, F, D, L, B
    face_order: List[int] = [0, 1, 2, 3, 4, 5]  # Up, Right, Front, Down, Left, Back

    for face_idx in face_order:
        face = cube_array[face_idx]
        for row in face:
            for cell in row:
                facelet_string += color_map[cell]

    return facelet_string


def validate_cube_state(cube_array: List[List[List[int]]]) -> Tuple[bool, str]:
    """
    Basic validation of cube state.
    - Check dimensions (6 faces, each 3x3)
    - Check color counts (9 of each color)
    - Check center squares for consistency

    Note: This function only does basic validation. The kociemba algorithm
    will perform additional validation to ensure the cube state is physically
    solvable. A cube can pass this validation but still be rejected by kociemba
    if it represents an impossible cube configuration.
    """
    if len(cube_array) != 6:
        return False, "Cube must have exactly 6 faces"

    color_counts: Dict[int, int] = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

    for i, face in enumerate(cube_array):
        if len(face) != 3:
            return False, f"Face {i} must have 3 rows"
        for j, row in enumerate(face):
            if len(row) != 3:
                return False, f"Face {i}, row {j} must have 3 cells"
            for cell in row:
                if cell not in color_counts:
                    return False, f"Invalid color value: {cell}. Must be 0-5"
                color_counts[cell] += 1

    # Each color should appear exactly 9 times
    for color, count in color_counts.items():
        if count != 9:
            return False, f"Color {color} appears {count} times, should be 9"

    # Check that center squares are unique (each face has a different center)
    center_colors = []
    for i, face in enumerate(cube_array):
        center_color = face[1][1]  # Center is at [1][1]
        center_colors.append(center_color)

    if len(set(center_colors)) != 6:
        return (
            False,
            f"Center squares must be unique colors. Found centers: {center_colors}",
        )

    return True, "Valid"


@method_decorator(csrf_exempt, name="dispatch")
class SolveCubeView(View):
    """
    Solve a Rubik's cube using Kociemba's algorithm.

    Expected POST input:
    {
        "cube": [
            [[0,1,0], [1,1,1], [0,1,0]],  # Up face
            [[1,2,1], [2,2,2], [1,2,1]],  # Right face
            [[2,3,2], [3,3,3], [2,3,2]],  # Front face
            [[3,4,3], [4,4,4], [3,4,3]],  # Down face
            [[4,5,4], [5,5,5], [4,5,4]],  # Left face
            [[5,0,5], [0,0,0], [5,0,5]]   # Back face
        ]
    }

    Returns:
    {
        "solution": ["R", "U'", "R'", "F", "R", "F'"],
        "move_count": 6,
        "status": "success"
    }
    """

    def _get_client_ip(self, request: HttpRequest) -> str:
        """Get client IP address from request."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip or "unknown"

    def post(self, request: HttpRequest) -> JsonResponse:
        try:
            # Add debug logging
            print(f"Received request body: {request.body}")
            print(f"Request content type: {request.content_type}")

            try:
                data = json.loads(request.body)
                print(f"Parsed JSON data: {data}")
                cube_data = CubeRequestBody(**data)
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                return JsonResponse(
                    {"error": "Invalid JSON in request body", "status": "error"},
                    status=400,
                )
            except ValidationError as e:
                print(f"Validation error: {e.errors()}")
                return JsonResponse(
                    {"error": f"Invalid request body: {e.errors()}", "status": "error"},
                    status=400,
                )
            except Exception as e:
                print(f"Unexpected error in data parsing: {e}")
                return JsonResponse(
                    {"error": f"Data parsing error: {str(e)}", "status": "error"},
                    status=500,
                )

            if "cube" not in data:  # This check might be redundant with Pydantic
                return JsonResponse(
                    {"error": "Missing 'cube' in request body", "status": "error"},
                    status=400,
                )

            cube_array: List[List[List[int]]] = cube_data.cube

            # Validate cube state
            is_valid: bool
            message: str
            is_valid, message = validate_cube_state(cube_array)
            if not is_valid:
                return JsonResponse(
                    {"error": f"Invalid cube state: {message}", "status": "error"},
                    status=400,
                )

            # Convert to kociemba format
            facelet_string: str = cube_array_to_facelet_string(cube_array)
            print(f"Generated facelet string: {facelet_string}")
            print(f"Facelet string length: {len(facelet_string)}")

            # Check if the cube is already solved
            solved_facelet_string: str = (
                "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
            )
            if facelet_string == solved_facelet_string:
                # Save solve record for already solved cube
                try:
                    client_ip = self._get_client_ip(request)
                    CubeSolve.objects.create(
                        facelet_string=facelet_string,
                        solution="",  # Empty string for already solved
                        move_count=0,
                        solve_time_ms=0.0,
                        ip_address=client_ip,
                    )
                except Exception as db_error:
                    print(f"Failed to save solve record: {db_error}")

                return JsonResponse(
                    {
                        "solution": [],
                        "move_count": 0,
                        "status": "success",
                        "message": "Cube is already solved",
                        "facelet_string": facelet_string,
                    }
                )

            # Solve using kociemba
            try:
                # Track solve time
                solve_start = time.time()
                solution_string: str = kociemba.solve(facelet_string)
                solve_end = time.time()
                solve_time_ms = (solve_end - solve_start) * 1000

                if solution_string == "Error":
                    return JsonResponse(
                        {"error": "Cube state is unsolvable", "status": "error"},
                        status=400,
                    )

                # Parse solution string into move list
                moves: List[str] = solution_string.split() if solution_string else []

                # Save solve record to database
                try:
                    # Get client IP address
                    client_ip = self._get_client_ip(request)

                    CubeSolve.objects.create(
                        facelet_string=facelet_string,
                        solution=solution_string,
                        move_count=len(moves),
                        solve_time_ms=solve_time_ms,
                        ip_address=client_ip,
                    )
                except Exception as db_error:
                    # Log the error but don't fail the request
                    print(f"Failed to save solve record: {db_error}")

                print(f"Cube solved in {solve_time_ms:.2f} ms with moves: {moves}")

                return JsonResponse(
                    {
                        "solution": moves,
                        "move_count": len(moves),
                        "status": "success",
                        "solve_time_ms": round(solve_time_ms, 2),
                        "facelet_string": facelet_string,  # For debugging
                    }
                )

            except ValueError as ve:
                # This is likely from kociemba saying the cube string is invalid
                print(f"Kociemba ValueError: {ve}")
                return JsonResponse(
                    {
                        "error": "Invalid cube configuration - this cube state is not physically solvable",
                        "details": str(ve),
                        "facelet_string": facelet_string,
                        "status": "error",
                    },
                    status=400,
                )

            except Exception as e:
                print(f"Solver exception: {e}")
                import traceback

                traceback.print_exc()
                return JsonResponse(
                    {"error": f"Solver error: {str(e)}", "status": "error"}, status=500
                )

        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "Invalid JSON in request body", "status": "error"}, status=400
            )
        except Exception as e:
            print(f"Unexpected server error in SolveCubeView: {e}")
            import traceback

            traceback.print_exc()
            return JsonResponse(
                {"error": f"Server error: {str(e)}", "status": "error"}, status=500
            )


@method_decorator(csrf_exempt, name="dispatch")
class ValidateCubeView(View):
    """
    Validate a cube state without solving it.
    """

    def post(self, request: HttpRequest) -> JsonResponse:
        try:
            try:
                data = json.loads(request.body)
                cube_data = CubeRequestBody(**data)
            except json.JSONDecodeError:
                return JsonResponse(
                    {"error": "Invalid JSON in request body", "status": "error"},
                    status=400,
                )
            except ValidationError as e:
                return JsonResponse(
                    {"error": f"Invalid request body: {e.errors()}", "status": "error"},
                    status=400,
                )

            if "cube" not in data:  # This check might be redundant with Pydantic
                return JsonResponse(
                    {"error": "Missing 'cube' in request body", "status": "error"},
                    status=400,
                )

            cube_array: List[List[List[int]]] = cube_data.cube
            is_valid: bool
            message: str
            is_valid, message = validate_cube_state(cube_array)

            if is_valid:
                facelet_string: str = cube_array_to_facelet_string(cube_array)
                return JsonResponse(
                    {
                        "valid": True,
                        "message": message,
                        "facelet_string": facelet_string,
                        "status": "success",
                    }
                )
            else:
                return JsonResponse(
                    {"valid": False, "message": message, "status": "error"}, status=400
                )

        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "Invalid JSON in request body", "status": "error"}, status=400
            )
        except Exception as e:
            return JsonResponse(
                {"error": f"Server error: {str(e)}", "status": "error"}, status=500
            )


@require_http_methods(["GET"])
def health_check(request: HttpRequest) -> JsonResponse:
    """Simple health check endpoint."""
    return JsonResponse(
        {"status": "healthy", "message": "Rubik's Cube Solver API is running"}
    )


@require_http_methods(["GET"])
def solve_history(request: HttpRequest) -> JsonResponse:
    """Get recent solve history."""
    try:
        # Get query parameters for pagination
        limit = int(request.GET.get("limit", 50))  # Default to 50 records
        offset = int(request.GET.get("offset", 0))  # Default to no offset

        # Limit the maximum number of records that can be retrieved at once
        limit = min(limit, 100)

        # Query the database
        solves = CubeSolve.objects.all()[offset : offset + limit]

        # Convert to JSON-serializable format
        solve_data = []
        for solve in solves:
            solve_data.append(
                {
                    "id": solve.id,  # type: ignore
                    "facelet_string": solve.facelet_string,
                    "solution": solve.solution.split() if solve.solution else [],
                    "move_count": solve.move_count,
                    "solve_time_ms": solve.solve_time_ms,
                    "timestamp": solve.timestamp.isoformat(),
                    "ip_address": solve.ip_address,
                }
            )

        # Get total count for pagination
        total_count = CubeSolve.objects.count()

        return JsonResponse(
            {
                "solves": solve_data,
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "status": "success",
            }
        )

    except ValueError:
        return JsonResponse(
            {"error": "Invalid limit or offset parameter", "status": "error"},
            status=400,
        )
    except Exception as e:
        return JsonResponse(
            {"error": f"Server error: {str(e)}", "status": "error"}, status=500
        )


# Function-based view alternatives (if you prefer)
@csrf_exempt
@require_http_methods(["POST"])
def solve_cube_fbv(request: HttpRequest) -> JsonResponse:
    """Function-based view version of solve_cube"""
    try:
        try:
            data = json.loads(request.body)
            cube_data = CubeRequestBody(**data)
        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "Invalid JSON in request body", "status": "error"}, status=400
            )
        except ValidationError as e:
            return JsonResponse(
                {"error": f"Invalid request body: {e.errors()}", "status": "error"},
                status=400,
            )

        if "cube" not in data:  # This check might be redundant with Pydantic
            return JsonResponse(
                {"error": "Missing 'cube' in request body", "status": "error"},
                status=400,
            )

        cube_array: List[List[List[int]]] = cube_data.cube

        # Validate cube state
        is_valid: bool
        message: str
        is_valid, message = validate_cube_state(cube_array)
        if not is_valid:
            return JsonResponse(
                {"error": f"Invalid cube state: {message}", "status": "error"},
                status=400,
            )

        # Convert to kociemba format
        facelet_string: str = cube_array_to_facelet_string(cube_array)

        # Solve using kociemba
        try:
            # Track solve time
            solve_start = time.time()
            solution_string: str = kociemba.solve(facelet_string)
            solve_end = time.time()
            solve_time_ms = (solve_end - solve_start) * 1000

            if solution_string == "Error":
                return JsonResponse(
                    {"error": "Cube state is unsolvable", "status": "error"}, status=400
                )

            # Parse solution string into move list
            moves: List[str] = solution_string.split() if solution_string else []

            # Save solve record to database
            try:
                # Get client IP address
                def get_client_ip(request: HttpRequest) -> str:
                    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
                    if x_forwarded_for:
                        ip = x_forwarded_for.split(",")[0]
                    else:
                        ip = request.META.get("REMOTE_ADDR")
                    return ip or "unknown"

                client_ip = get_client_ip(request)

                CubeSolve.objects.create(
                    facelet_string=facelet_string,
                    solution=solution_string,
                    move_count=len(moves),
                    solve_time_ms=solve_time_ms,
                    ip_address=client_ip,
                )
            except Exception as db_error:
                # Log the error but don't fail the request
                print(f"Failed to save solve record: {db_error}")

            return JsonResponse(
                {
                    "solution": moves,
                    "move_count": len(moves),
                    "status": "success",
                    "solve_time_ms": round(solve_time_ms, 2),
                    "facelet_string": facelet_string,
                }
            )

        except Exception as e:
            return JsonResponse(
                {"error": f"Solver error: {str(e)}", "status": "error"}, status=500
            )

    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON in request body", "status": "error"}, status=400
        )
    except Exception as e:
        return JsonResponse(
            {"error": f"Server error: {str(e)}", "status": "error"}, status=500
        )
