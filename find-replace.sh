#!/usr/bin/env bash
# ./find-replace.sh FIND REPLACE
# Finds a string in all html files and replaces it with another string
# Slashes must be escaped in both strings

find . -type f -name "*.html" -print0 | xargs -0 sed -i 's/$1/$2/g'
