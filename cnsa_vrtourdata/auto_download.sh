#!/bin/bash

ERROR_FILE="errors.txt"

while IFS= read -r line; do
    if [[ "$line" == *"GET http://"* ]]; then

        # 1) 로컬 URL 추출
        LOCAL_URL=$(echo "$line" | sed -E 's/.*GET (http:\/\/[^ ]*).*/\1/')

        # 2) 로컬 URL에서 경로만 추출
        REL_PATH=$(echo "$LOCAL_URL" | sed -E 's|http://172\.27\.71\.29:7777/||')

        # 3) 원본 서버 URL로 치환
        REAL_URL="https://www.cnsa.hs.kr/sub01/$REL_PATH"

        # 4) 로컬 저장 경로 동일하게 구성
        mkdir -p "$(dirname "$REL_PATH")"

        echo "Downloading: $REAL_URL"
        wget -nc -O "$REL_PATH" "$REAL_URL"
    fi
done < "$ERROR_FILE"
