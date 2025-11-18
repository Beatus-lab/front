#!/bin/bash

HAR_FILE="gaaah.har"

if [ ! -f "$HAR_FILE" ]; then
    echo "HAR 파일 ($HAR_FILE)을 현재 디렉터리에 두고 실행하세요."
    exit 1
fi

# HAR 안의 모든 요청 URL 추출
jq -r '.log.entries[].request.url' "$HAR_FILE" |
# 로컬 서버에서 온 요청만 필터링
grep '^http://172\.27\.71\.29:7777/cnsa_vrtourdata/' |
# 원본 서버 URL로 변환
sed -E 's|http://172\.27\.71\.29:7777/|https://www.cnsa.hs.kr/sub01/|' |
# 중복 제거
sort -u |
while read -r URL; do
    # 로컬에 저장할 경로 계산
    REL_PATH=$(echo "$URL" | sed -E 's|https://www.cnsa.hs.kr/sub01/||')

    # 디렉터리 생성
    DIR=$(dirname "$REL_PATH")
    mkdir -p "$DIR"

    # 이미 있으면 스킵
    if [ -f "$REL_PATH" ]; then
        echo "이미 존재: $REL_PATH"
        continue
    fi

    echo "다운로드: $URL → $REL_PATH"
    wget -nc -O "$REL_PATH" "$URL"
done
