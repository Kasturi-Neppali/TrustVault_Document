

import os
import hashlib
import uuid

from werkzeug.utils import secure_filename


# Allowed document extensions
ALLOWED_EXTENSIONS = {
    "pdf",
    "doc",
    "docx",
    "txt",
    "xlsx",
    "csv"
}


def allowed_file(filename):

    if "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()

    return extension in ALLOWED_EXTENSIONS


def generate_file_hash(file_path):

    sha256 = hashlib.sha256()

    with open(file_path, "rb") as file:

        for chunk in iter(
            lambda: file.read(4096),
            b""
        ):
            sha256.update(chunk)

    return sha256.hexdigest()


def save_uploaded_file(uploaded_file, upload_folder):

    if not uploaded_file or not uploaded_file.filename:
        raise ValueError("No file was selected.")

    original_name = secure_filename(uploaded_file.filename)

    if not original_name or "." not in original_name:
        raise ValueError("Invalid filename.")

    if not allowed_file(original_name):
        raise ValueError("File type is not allowed.")

    extension = original_name.rsplit(".", 1)[1].lower()

    unique_filename = f"{uuid.uuid4().hex}.{extension}"

    os.makedirs(upload_folder, exist_ok=True)

    file_path = os.path.join(upload_folder, unique_filename)

    uploaded_file.save(file_path)

    file_hash = generate_file_hash(file_path)

    return {
        "original_name": original_name,
        "storage_name": unique_filename,
        "file_path": file_path,
        "file_hash": file_hash
    }
