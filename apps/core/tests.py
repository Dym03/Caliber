import json

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse


class AuthFlowTests(TestCase):
	def test_status_is_unauthenticated_by_default(self):
		response = self.client.get(reverse("auth_status"))
		self.assertEqual(response.status_code, 200)
		self.assertFalse(response.json()["authenticated"])

	def test_register_logs_user_in(self):
		response = self.client.post(
			reverse("register_view"),
			data=json.dumps(
				{
					"email": "doctor@example.com",
					"username": "oncology",
					"password": "StrongPass123!",
					"password_confirm": "StrongPass123!",
				}
			),
			content_type="application/json",
		)

		self.assertEqual(response.status_code, 201)
		payload = response.json()
		self.assertTrue(payload["authenticated"])
		self.assertEqual(payload["user"]["email"], "doctor@example.com")
		self.assertTrue(get_user_model().objects.filter(email="doctor@example.com").exists())

	def test_search_requires_authentication(self):
		response = self.client.get(reverse("search_variants"), {"gene": "BRCA1"})
		self.assertEqual(response.status_code, 401)

	def test_login_and_logout_round_trip(self):
		user = get_user_model().objects.create_user(
			email="nurse@example.com",
			username="ward-a",
			password="StrongPass123!",
		)

		login_response = self.client.post(
			reverse("login_view"),
			data=json.dumps({"email": user.email, "password": "StrongPass123!"}),
			content_type="application/json",
		)
		self.assertEqual(login_response.status_code, 200)
		self.assertTrue(login_response.json()["authenticated"])

		logout_response = self.client.post(reverse("logout_view"))
		self.assertEqual(logout_response.status_code, 200)
		self.assertFalse(logout_response.json()["authenticated"])
