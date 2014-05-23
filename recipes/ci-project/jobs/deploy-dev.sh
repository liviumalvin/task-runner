#!/bin/bash

git reset --hard HEAD

echo "GIT fetch init"

git fetch
git checkout dev
git rebase origin/dev

echo "GIT fetch success"