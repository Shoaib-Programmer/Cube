
from django.test import TestCase, Client # type: ignore
from .views import validate_cube_state, cube_array_to_facelet_string
import json

class CubeValidationTests(TestCase):
	def test_valid_cube(self):
		# Standard solved cube
		cube = [
			[[0,0,0],[0,0,0],[0,0,0]], # Up
			[[1,1,1],[1,1,1],[1,1,1]], # Right
			[[2,2,2],[2,2,2],[2,2,2]], # Front
			[[3,3,3],[3,3,3],[3,3,3]], # Down
			[[4,4,4],[4,4,4],[4,4,4]], # Left
			[[5,5,5],[5,5,5],[5,5,5]], # Back
		]
		valid, msg = validate_cube_state(cube)
		self.assertTrue(valid)
		self.assertEqual(msg, "Valid")

	def test_invalid_cube_wrong_color_count(self):
		cube = [
			[[0,0,0],[0,0,0],[0,0,0]],
			[[1,1,1],[1,1,1],[1,1,1]],
			[[2,2,2],[2,2,2],[2,2,2]],
			[[3,3,3],[3,3,3],[3,3,3]],
			[[4,4,4],[4,4,4],[4,4,4]],
			[[5,5,5],[5,5,5],[5,5,4]], # One color off
		]
		valid, msg = validate_cube_state(cube)
		self.assertFalse(valid)
		self.assertIn("appears", msg)

	def test_invalid_cube_wrong_shape(self):
		cube = [
			[[0,0,0],[0,0,0],[0,0,0]],
			[[1,1,1],[1,1,1],[1,1,1]],
			[[2,2,2],[2,2,2],[2,2,2]],
			[[3,3,3],[3,3,3],[3,3,3]],
			[[4,4,4],[4,4,4],[4,4,4]],
			[[5,5,5],[5,5,5]], # Missing row
		]
		valid, msg = validate_cube_state(cube)
		self.assertFalse(valid)
		self.assertIn("must have 3 rows", msg)

class CubeFaceletStringTests(TestCase):
	def test_facelet_string(self):
		cube = [
			[[0,0,0],[0,0,0],[0,0,0]],
			[[1,1,1],[1,1,1],[1,1,1]],
			[[2,2,2],[2,2,2],[2,2,2]],
			[[3,3,3],[3,3,3],[3,3,3]],
			[[4,4,4],[4,4,4],[4,4,4]],
			[[5,5,5],[5,5,5],[5,5,5]],
		]
		facelet = cube_array_to_facelet_string(cube)
		self.assertEqual(facelet, "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB")

class CubeApiTests(TestCase):
	def setUp(self):
		self.client = Client()

	def test_health_check(self):
		response = self.client.get("/health/")
		self.assertEqual(response.status_code, 200)
		self.assertIn("status", response.json())

	def test_solve_solved_cube(self):
		cube = [
			[[0,0,0],[0,0,0],[0,0,0]],
			[[1,1,1],[1,1,1],[1,1,1]],
			[[2,2,2],[2,2,2],[2,2,2]],
			[[3,3,3],[3,3,3],[3,3,3]],
			[[4,4,4],[4,4,4],[4,4,4]],
			[[5,5,5],[5,5,5],[5,5,5]],
		]
		response = self.client.post("/solve/", data=json.dumps({"cube": cube}), content_type="application/json")
		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()["move_count"], 0)

	def test_validate_valid_cube(self):
		cube = [
			[[0,0,0],[0,0,0],[0,0,0]],
			[[1,1,1],[1,1,1],[1,1,1]],
			[[2,2,2],[2,2,2],[2,2,2]],
			[[3,3,3],[3,3,3],[3,3,3]],
			[[4,4,4],[4,4,4],[4,4,4]],
			[[5,5,5],[5,5,5],[5,5,5]],
		]
		response = self.client.post("/validate/", data=json.dumps({"cube": cube}), content_type="application/json")
		self.assertEqual(response.status_code, 200)
		self.assertTrue(response.json()["valid"])
