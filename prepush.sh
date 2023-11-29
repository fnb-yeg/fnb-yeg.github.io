#!/usr/bin/env bash

# Requires bash, GNU coreutils, and ImageMagick

files=`git ls-files -mo`

for file in $files; do
	mime=`file $file -ib -F ';' -e encoding | cut -d ";" -f 1`

	printf "$file ($mime): "

	case $mime in
		"text/plain")
			# Unexpand spaces (reduce bandwidth)
			printf "Converting spaces to tabs"

			unexpand $file -t 4 > $file.unexpanded
			mv $file.unexpanded $file
		;;
		"image/jpeg")
			printf "Interlacing and compressing to 75%"

			convert -interlace JPEG -quality 75 $file $file.converted
			mv $file.converted $file
		;;
		*)
			printf " No action"
	esac

	printf "\n"
done
