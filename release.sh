#!/bin/bash

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: ./release.sh <version>"
    echo "Example: ./release.sh 0.1.0"
    kill $$
fi

TAG_VERSION="v$VERSION"
if [[ $VERSION == v* ]]; then
    TAG_VERSION=$VERSION
    VERSION=${VERSION#v}
fi

echo "Bumping version to $VERSION and tagging as $TAG_VERSION..."

npm version $VERSION --no-git-tag-version
cd backend && npm version $VERSION --no-git-tag-version && cd ..
cd frontend && npm version $VERSION --no-git-tag-version && cd ..

git add package.json backend/package.json frontend/package.json
git commit -m "chore: bump version to $VERSION"
git tag $TAG_VERSION

echo "Done! To push the release, run:"
echo "git push origin main --tags"
