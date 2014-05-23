#!/bin/bash
git reset --hard HEAD

echo "[MASTER] GIT fetch init"

git fetch
git checkout master

echo "[MASTER] GIT fetch success"