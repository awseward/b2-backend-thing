### `get_upload_url`

```sh
curl -s 'https://drewrelic.com/get_upload_url' -H 'Content-Type: application/json' -d "
  {
    \"keyId\": \"${APPLICATION_KEY_ID}\",
    \"key\": \"${APPLICATION_KEY}\"
  }
" | jq .
```

### `b2_upload_file`

NOTE: Sort of a weird caveat where doing the whole `"$(cat …)"` thing strips
the last newline in the file which can make the checksum a little fiddly if
you're not careful.

Basically, need this in vim: `:set nofixendofline`.

Actually building the frontend for this will not really have this issue, it's
just a quirk of these exploratory curl snippets 🤷…

```sh
curl -v \
  -XPOST "${UPLOAD_URL}" \
  -H "Authorization: ${AUTHORIZATION_TOKEN}" \
  -H 'X-Bz-File-Name: test.yml' \
  -H 'Content-Type: b2/x-auto' \
  -H "X-Bz-Content-Sha1: $(sha1sum test.yml | cut -d ' ' -f1)" \
	--data-binary "$(cat test.yml)" | jq .
```
