#!/bin/bash

node='/usr/local/bin/node'

function test_good() {
    local file="$1"
    local msgs="`$node /Users/chaimleib/tincanschema/validate.js $file 2>&1`"
    local code=$?
    if echo "$msgs" | grep '^No errors!$' >/dev/null; then
        echo "OK"
    else
        echo "FAILED"
        echo "$msgs"
    fi
}

function test_bad() {
    local file="$1"
    local msgs="`$node /Users/chaimleib/tincanschema/validate.js $file 2>&1`"
    local code=$?
    if echo "$msgs" | grep '^No errors!$' >/dev/null; then
        echo "FAILED"
        echo "Unexpected success on $dir/$file !"
        echo "$msgs"
    elif echo "$msgs" | grep '^Error: Validation failed' >/dev/null; then
        echo "OK"
        # echo "$msgs"
    else
        echo "Unexpected error:"
        echo "$msgs"
    fi
}

pushd test_data >/dev/null
for dir in *; do
    ! [[ -d $dir ]] && continue

    pushd $dir >/dev/null
    for file in *.json; do
        printf "%-50s" "Validating $dir/$file...  "
        case "$file" in
        *-good.json) test_good "$file" ;;
        *-bad.json)  test_bad "$file" ;;
        *) continue ;;
        esac
    done
    popd >/dev/null
done
popd >/dev/null
