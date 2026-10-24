#!/usr/bin/env sh
# Removes lines matching a regular expression
# Usage: batchreplace.sh FIND -r [REPLACE] FILES...
# Requires gawk

# Lines matching this regular expression will be replaced in processed files
#FIND="/61ecb696cf7d4566a985a68c\">Join Our Birthday Club<\/a>/"
#REPLACE=""

# Not enough args to parse; show usage info
if [ $# -lt 2 ]; then
    echo Usage: $0 FIND [-r REPLACE] FILES...\\n
    echo Finds a regular expression in files and replaces it
    echo FIND is a gawk regular expression
    echo REPLACE specifies the string to replace with. If omitted, an empty string is used
    echo One or more FILES must be specified
    exit
fi

# Get find regex
FIND=$1
shift

# Get replace string
if [ $1 = '-r' ]; then
    REPLACE=$2
    shift 2
else
    REPLACE=""
fi

# Error if no files are specified
if [ $# -eq 0 ]; then
    printf "\033[31mError: At least 1 file path must be supplied\033[0m\n" 1>&2
    exit
fi

printf "Working in '`pwd`/'\n"

for file; do
    if [ ! -e $file ]; then
        # File does not exist
        printf "\033[31mError: '`pwd`/\033[1m$file\033[22m' does not exist\033[0m\n" 1>&2
    elif [ -d $file ]; then
        # File is a directory
        printf "\033[31mError: '`pwd`/\033[1m$file\033[22m' is a directory\033[0m\n" 1>&2
    else
        printf "Processing '$file'\n"

        # Create temp file with matching lines removed
        gawk -v FIND="@$FIND" -v REPLACE="$REPLACE"\
            '$0 ~ FIND { print REPLACE; next }
            { print }' $file >${file}.tmp
        mv ${file}.tmp $file

        if [ $? -gt 0 ]; then
            # Move operation failed
            printf "\033[31mError: Failed to overwrite '`pwd`/\033[1m$file\033[22m' with temp file\033[0m\n" 1>&2
        fi
    fi
done

printf "\033[32mDone!\033[0m\n"

