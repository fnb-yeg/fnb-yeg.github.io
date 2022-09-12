#!/bin/bash

sed -i -E 's/data-(bs-)?/data-bs-/g' $1

sed -i -E 's/sr-only-focusable/visually-hidden-focusable/g' $1
sed -i -E 's/sr-only/visually-hidden/g' $1
