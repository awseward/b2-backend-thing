import cors from 'cors';
import express from 'express'
import expressWinston from 'express-winston';
import winston from 'winston';
import b2, { AppCred, B2AccountAuthorization, B2GetUploadUrlResponse }  from './b2';
import { HasLinks, _links } from './links';

interface Req<T> extends express.Request { body: T }
type Res<T> = express.Response<T, Record<string, any>>;

const app = express();
const port = 5001;
app.use(express.json());

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.simple(),
  meta: true,
}));
app.use(cors());

type Ok<T> = ((resBody: T) => Res<T>);
const ok_ = <T,>(res: Res<T>): Ok<T> => (body: T) => res.status(200).send(body);

type CB<TReq, TRes> = ((reqBody : TReq, ok : Ok<TRes>, req: Req<TReq>, res: Res<TRes>) => Promise<void>);
const post = <TReq, TRes>(route: string, cb: CB<TReq, TRes>) =>
  app.post(
    route,
    async (req: Req<TReq>, res: Res<TRes>) => cb(req.body, ok_(res), req, res)
  );

type AccountAuthorizationParams = AppCred;
type AccountAuthorization =
  Pick<B2AccountAuthorization, 'apiUrl'|'authorizationToken'|'downloadUrl'>
  & { bucketId: string; }
  & HasLinks<'getUploadUrl'>;

post<AccountAuthorizationParams, AccountAuthorization>(
  '/api/authorize_account',
  async (reqBody, ok) => {
    const {
      allowed: { bucketId },
      apiUrl,
      authorizationToken,
      downloadUrl,
    } = await b2.authorizeAccount(reqBody);
    ok({
      ..._links({
        getUploadUrl: {
          href: '/api/get_upload_url',
          method: 'POST',
        }
      }),
      apiUrl,
      authorizationToken,
      bucketId,
      downloadUrl,
    });
  }
);

interface UploadInfoParams {
  apiUrl: string;
  authorizationToken: string;
  bucketId: string;
}
type UploadInfo = B2GetUploadUrlResponse & HasLinks<'uploadFile'>;

post<UploadInfoParams, UploadInfo>(
  '/api/get_upload_url',
  async (reqBody, ok) => {
    const { apiUrl, authorizationToken, bucketId } = reqBody;
    const b2Res = await b2.getUploadUrl(
      { apiUrl, versionNumber: 2, },
      authorizationToken,
      bucketId
    );

    ok({
      ..._links({
        uploadFile: {
          href: b2Res.uploadUrl,
          method: 'POST',
        }
      }),
      ...b2Res,
    });
  }
);

app.listen(port, () => console.log(`Running on port ${port}`));
