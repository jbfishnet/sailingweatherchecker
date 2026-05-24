import os
import sys

def check_file(path, content_checks):
    if not os.path.exists(path):
        print(f"ERROR: {path} is missing")
        return False

    with open(path, 'r') as f:
        content = f.read()
        for check in content_checks:
            if check not in content:
                print(f"ERROR: {path} is missing required content: '{check}'")
                return False
    print(f"OK: {path} looks good")
    return True

def main():
    success = True

    # Check Backend Dockerfile
    success &= check_file('backend/Dockerfile', [
        'FROM node:20-bookworm-slim',
        'python3',
        'make',
        'g++',
        'npm install --omit=dev'
    ])

    # Check Frontend Dockerfile
    success &= check_file('frontend/Dockerfile', [
        'FROM nginx:stable-alpine',
        'COPY --from=builder'
    ])

    # Check docker-compose
    success &= check_file('docker-compose.yml', [
        'services:',
        'backend:',
        'frontend:',
        'sailing-data:'
    ])

    if not success:
        sys.exit(1)
    print("All Docker validation checks passed!")

if __name__ == "__main__":
    main()
