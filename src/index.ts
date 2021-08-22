import express from 'express'

interface AppCred {
  keyId: string;
  key: string;
};

export const mkAuthHeader = ({ keyId, key }: AppCred) =>
  `Basic ${btoa(`${keyId}:${key}`)}`;

interface UrlParts {
  apiUrl: string; // returned by b2_authorize_account
  versionNumber: number;
  apiName: string;
}

export const mkUrl = ({ apiUrl, versionNumber, apiName }: UrlParts) =>
  `${apiUrl}/b2api/v${versionNumber}/${apiName}`;

const app = express();
const port = 5001;

app.use(express.json());

app.get('/', (_, res) => {
  res.status(200).send();
});

// curl -XPOST localhost:5001/get_upload_url -H 'Content-Type: application/json' -d '{ "keyId": "foo", "key": "bar" }'
app.post('/get_upload_url', (req, res) => {
  // TODO: Figure out how to make this error if the req body doesn't match the interface we're expecting…
  res.status(501).send(mkAuthHeader(req.body));
});

app.listen(port, () => console.log(`Running on port ${port}`));
