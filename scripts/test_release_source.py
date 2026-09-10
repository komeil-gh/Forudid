"""Small regression check for the public archive's data boundary."""

import io
import tarfile
import unittest

from release_source import inspect_archive


class ReleaseBoundaryTest(unittest.TestCase):
    def test_notice_requirement_and_private_entries(self):
        notices = ["LICENSE", "NOTICE", "THIRD_PARTY_NOTICES.md", "README.md",
                   "LICENSES/ODbL-1.0.txt", "apps/web/public/fonts/xb-zar/OFL.txt"]

        def archive(extra=None, kind=tarfile.REGTYPE):
            stream = io.BytesIO()
            with tarfile.open(fileobj=stream, mode="w") as result:
                for name in notices + ([extra] if extra else []):
                    info = tarfile.TarInfo(name)
                    info.type = kind if name == extra else tarfile.REGTYPE
                    result.addfile(info, io.BytesIO())
            return stream.getvalue()

        self.assertEqual(len(inspect_archive(archive(".env.example"))), 7)
        for path in [".env", ".env.local", "../outside", "/outside", ".git/config",
                     "data/source.json", "node_modules/index.js", "AGENTS.md",
                     "apps/web/public/source-marks/logo.svg", "measurement.tif"]:
            with self.subTest(path=path), self.assertRaises(ValueError):
                inspect_archive(archive(path))
        with self.assertRaises(ValueError):
            inspect_archive(archive("link", tarfile.SYMTYPE))
        notices.pop()
        with self.assertRaises(ValueError):
            inspect_archive(archive())


if __name__ == "__main__":
    unittest.main()
