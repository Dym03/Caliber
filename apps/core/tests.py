import json

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse


class AuthFlowTests(TestCase):
    def setUp(self):
        super().setUp()
        cache.clear()

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
        self.assertTrue(
            get_user_model().objects.filter(email="doctor@example.com").exists()
        )

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

    def test_register_rejects_weak_passwords(self):
        # Short / entirely numeric password
        response = self.client.post(
            reverse("register_view"),
            data=json.dumps(
                {
                    "email": "weak@example.com",
                    "username": "weakuser",
                    "password": "123",
                    "password_confirm": "123",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        error_msg = response.json().get("error", "")
        self.assertIn("krátké", error_msg)
        self.assertIn("čísel", error_msg)
        self.assertFalse(
            get_user_model().objects.filter(email="weak@example.com").exists()
        )

    def test_register_rejects_password_similar_to_username(self):
        response = self.client.post(
            reverse("register_view"),
            data=json.dumps(
                {
                    "email": "doctor1@example.com",
                    "username": "superdoctor",
                    "password": "superdoctor2026!",
                    "password_confirm": "superdoctor2026!",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        error_msg = response.json().get("error", "")
        self.assertIn("podobné", error_msg)
        self.assertIn("uživatelskému jménu", error_msg)

    @override_settings(REQUIRE_ACCOUNT_APPROVAL=True)
    def test_register_with_account_approval_required(self):
        response = self.client.post(
            reverse("register_view"),
            data=json.dumps(
                {
                    "email": "pending@example.com",
                    "username": "pendinguser",
                    "password": "StrongPass123!",
                    "password_confirm": "StrongPass123!",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertFalse(payload["authenticated"])
        self.assertTrue(payload.get("pending_approval"))
        self.assertIn("schválení", payload.get("message", ""))

        user = get_user_model().objects.get(email="pending@example.com")
        self.assertFalse(user.is_active)

    def test_login_inactive_user_shows_approval_pending(self):
        user = get_user_model().objects.create_user(
            email="inactive@example.com",
            username="inactiveuser",
            password="StrongPass123!",
            is_active=False,
        )

        response = self.client.post(
            reverse("login_view"),
            data=json.dumps({"email": user.email, "password": "StrongPass123!"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn("schválení", response.json().get("error", ""))

    def test_login_rate_limiting(self):
        for _ in range(5):
            res = self.client.post(
                reverse("login_view"),
                data=json.dumps(
                    {"email": "attacker@example.com", "password": "WrongPassword!"}
                ),
                content_type="application/json",
            )
            self.assertEqual(res.status_code, 400)

        # 6th attempt should be rate limited
        blocked_res = self.client.post(
            reverse("login_view"),
            data=json.dumps(
                {"email": "attacker@example.com", "password": "WrongPassword!"}
            ),
            content_type="application/json",
        )
        self.assertEqual(blocked_res.status_code, 429)
        self.assertIn("error", blocked_res.json())

    def test_register_rate_limiting(self):
        for i in range(10):
            res = self.client.post(
                reverse("register_view"),
                data=json.dumps(
                    {
                        "email": f"user{i}@example.com",
                        "username": f"user{i}",
                        "password": "StrongPass123!",
                        "password_confirm": "StrongPass123!",
                    }
                ),
                content_type="application/json",
            )
            self.assertEqual(res.status_code, 201)

        # 11th registration attempt from the same IP should be rate limited
        blocked_res = self.client.post(
            reverse("register_view"),
            data=json.dumps(
                {
                    "email": "user11@example.com",
                    "username": "user11",
                    "password": "StrongPass123!",
                    "password_confirm": "StrongPass123!",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(blocked_res.status_code, 429)
        self.assertIn("error", blocked_res.json())


class InitDBCacheTests(TestCase):
    def test_import_caches_clear(self):
        from apps.core.management.commands.init_db import ImportCaches
        from apps.core.models import Patient

        caches = ImportCaches()
        caches.patient_cache["P001"] = Patient(name="P001")
        caches.variant_gene_m2m_cache.add((1, 2))
        self.assertEqual(len(caches.patient_cache), 1)
        self.assertEqual(len(caches.variant_gene_m2m_cache), 1)

        caches.clear()
        self.assertEqual(len(caches.patient_cache), 0)
        self.assertEqual(len(caches.variant_gene_m2m_cache), 0)

    def test_parse_df_clears_caches_after_execution(self):
        import polars as pl
        from apps.core.management.commands.init_db import parse_df
        from apps.core.models import Patient, GeneVariant

        df = pl.DataFrame(
            {
                "Name": ["12345"],
                "Symbol": ["BRCA1"],
                "Variant_class": ["SNV"],
                "Chr": ["chr17"],
                "Coordinate": [43044295],
                "Reference": ["A"],
                "Alternate": ["G"],
                "VEP dbSNP ID": ["rs12345"],
                "HGVSc": ["NM_007294.3:c.100A>G"],
                "HGVSp": ["p.Lys34Arg"],
                "Kategorie": ["3"],
                "Komentář": ["Test comment"],
                "Exon": ["2"],
                "Genotype": ["het"],
                "gnomAD AF": ["0.001"],
            }
        )

        parse_df(df, "test_file.xlsx")

        self.assertTrue(Patient.objects.filter(name="12345").exists())
        self.assertTrue(GeneVariant.objects.filter(dbsnps__rsid="rs12345").exists())

    def test_parse_df_clears_owned_caches_on_exception(self):
        import polars as pl
        from unittest.mock import patch
        from apps.core.management.commands.init_db import parse_df

        df = pl.DataFrame(
            {
                "Name": ["12345"],
                "Chr": ["chr17"],
                "Coordinate": [43044295],
            }
        )

        with patch(
            "apps.core.management.commands.init_db.persist_row",
            side_effect=ValueError("Test crash"),
        ):
            with self.assertRaises(ValueError):
                parse_df(df, "faulty.xlsx")


class GeneVariantLongAlleleTests(TestCase):
    def test_genevariant_save_populates_allele_hash_and_supports_long_alleles(self):
        from django.db import IntegrityError
        from apps.core.models import GeneVariant, compute_allele_hash

        long_ref = "A" * 5000
        long_alt = "T" * 5000

        variant = GeneVariant.objects.create(
            chromosome="chr1",
            position=123456,
            variation_type="Deletion",
            ref_allele=long_ref,
            alt_allele=long_alt,
        )

        expected_hash = compute_allele_hash(long_ref, long_alt)
        self.assertEqual(variant.allele_hash, expected_hash)
        self.assertEqual(len(variant.allele_hash), 64)

        # Verify UniqueConstraint prevents duplicate coordinates + allele_hash
        with self.assertRaises(IntegrityError):
            GeneVariant.objects.create(
                chromosome="chr1",
                position=123456,
                variation_type="Deletion",
                ref_allele=long_ref,
                alt_allele=long_alt,
            )

    def test_parse_df_handles_long_alleles(self):
        import polars as pl
        from apps.core.management.commands.init_db import parse_df
        from apps.core.models import GeneVariant, compute_allele_hash

        long_ref = "C" * 1000
        long_alt = "G" * 1000

        df = pl.DataFrame(
            {
                "Name": ["54321"],
                "Symbol": ["TP53"],
                "Variant_class": ["SNV"],
                "Chr": ["chr17"],
                "Coordinate": [7577120],
                "Reference": [long_ref],
                "Alternate": [long_alt],
                "VEP dbSNP ID": ["rs99999"],
                "HGVSc": ["NM_000546.5:c.100C>G"],
                "HGVSp": ["p.Arg34Gln"],
                "Kategorie": ["4"],
                "Komentář": ["Long allele test"],
                "Exon": ["4"],
                "Genotype": ["het"],
                "gnomAD AF": ["0.00001"],
            }
        )

        parse_df(df, "long_allele_test.xlsx")

        var = GeneVariant.objects.get(dbsnps__rsid="rs99999")
        self.assertEqual(var.ref_allele, long_ref)
        self.assertEqual(var.alt_allele, long_alt)
        self.assertEqual(var.allele_hash, compute_allele_hash(long_ref, long_alt))

    def test_parse_df_handles_long_hgvs_and_reported_hgvs_c(self):
        import polars as pl
        from apps.core.management.commands.init_db import parse_df
        from apps.core.models import PatientVariant, TranscriptAnnotation

        long_hgvs = "NM_000546.5:c.100delins" + ("A" * 600)

        df = pl.DataFrame(
            {
                "Name": ["67890"],
                "Symbol": ["TP53"],
                "Variant_class": ["DEL"],
                "Chr": ["chr17"],
                "Coordinate": [7577200],
                "Reference": ["A" * 600],
                "Alternate": ["T"],
                "VEP dbSNP ID": ["rs88888"],
                "HGVSc": [long_hgvs],
                "HGVSp": ["p.Arg100delins" + ("Gln" * 150)],
                "Kategorie": ["3"],
                "Komentář": ["Long HGVS test"],
                "Exon": ["5"],
                "Genotype": ["het"],
                "gnomAD AF": ["0.0001"],
            }
        )

        parse_df(df, "long_hgvs_test.xlsx")

        pv = PatientVariant.objects.get(variant__dbsnps__rsid="rs88888")
        self.assertEqual(pv.reported_hgvs_c, long_hgvs)

        ann = TranscriptAnnotation.objects.get(variant__dbsnps__rsid="rs88888")
        self.assertEqual(ann.transcript_base, "NM_000546")
        self.assertEqual(ann.hgvs_c, "c.100delins" + ("A" * 600))


class PatientVariantReuploadTests(TestCase):
    def test_parse_df_overrides_unclassified_category_on_reupload(self):
        import polars as pl
        from apps.core.management.commands.init_db import parse_df
        from apps.core.models import PatientVariant

        row_data = {
            "Name": ["99001"],
            "Symbol": ["BRCA1"],
            "Variant_class": ["SNV"],
            "Chr": ["chr17"],
            "Coordinate": [43044295],
            "Reference": ["A"],
            "Alternate": ["G"],
            "VEP dbSNP ID": ["rs999001"],
            "HGVSc": ["NM_007294.3:c.100A>G"],
            "HGVSp": ["p.Lys34Arg"],
            "Kategorie": ["-1"],
            "Komentář": ["Initial unclassified comment"],
            "Exon": ["2"],
            "Genotype": ["het"],
            "gnomAD AF": ["0.001"],
        }

        # 1. First upload with unclassified category (-1)
        df1 = pl.DataFrame(row_data)
        parse_df(df1, "reupload_report.xlsx")

        pv = PatientVariant.objects.get(
            report__report_name="reupload_report.xlsx",
            variant__dbsnps__rsid="rs999001",
        )
        self.assertEqual(pv.category, -1.0)
        self.assertEqual(pv.comment, "Initial unclassified comment")

        # 2. Re-upload same report and variant with classified category (5) and updated comment
        row_data_classified = dict(row_data)
        row_data_classified["Kategorie"] = ["5"]
        row_data_classified["Komentář"] = ["Updated classified comment"]
        df2 = pl.DataFrame(row_data_classified)
        parse_df(df2, "reupload_report.xlsx")

        pv.refresh_from_db()
        self.assertEqual(pv.category, 5.0)
        self.assertEqual(pv.comment, "Updated classified comment")

        # 3. Third upload with unclassified category (-1) should NOT downgrade category 5
        row_data_unclassified = dict(row_data)
        row_data_unclassified["Kategorie"] = ["-1"]
        row_data_unclassified["Komentář"] = ["Updated comment without category downgrade"]
        df3 = pl.DataFrame(row_data_unclassified)
        parse_df(df3, "reupload_report.xlsx")

        pv.refresh_from_db()
        self.assertEqual(pv.category, 5.0)
        self.assertEqual(pv.comment, "Updated comment without category downgrade")

