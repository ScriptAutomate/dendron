import {
  DEngineStore,
  IDNode,
  NodeGetResp,
  NodeQueryResp,
  QueryOpts,
  Scope
} from "../../types";
import { Dropbox, files } from "dropbox";

import { ListFolderResultSimple } from "./types";
import _ from "lodash";
import { fileToNote } from "./utils";
import { makeResponse } from "../../helpers";

require("isomorphic-fetch");

function binaryToUtf8(data: any): string {
  const fileBuffer = new Buffer(data, "binary");
  return fileBuffer.toString("utf8");
}

export class DropboxStorage implements DEngineStore {
  private client: Dropbox;
  constructor() {
    this.client = new Dropbox({
      // TODO: don't hardcode
      accessToken:
        "AxthRhvjDPAAAAAAAACiPVhX_A4isFrjeyDXsV8H1yqARcM9fCInltiA0eZukImA"
    });
  }

  async get(_scope: Scope, id: string, opts?: QueryOpts): Promise<NodeGetResp> {
    opts = _.defaults(opts || {}, {});

    let resp: files.FileMetadata & { fileBlob: any; fileBinary: any };
    // check if root
    if (id === "root") {
      // @ts-ignore
      resp = await this.client.filesDownload({ path: `/root.md` });
    } else {
      // @ts-ignore
      resp = await this.client.filesDownload({ path: `id:${id}` });
    }
    console.log({ resp });
    let body: string = "Empty Doc";
    if (opts?.webClient) {
      body = await resp.fileBlob.text();
    } else {
      body = binaryToUtf8(resp.fileBinary);
    }
    const data = fileToNote(resp, body);
    return {
      data
    };
  }

  async query(
    _scope: Scope,
    queryString: string,
    _opts?: QueryOpts
  ): Promise<NodeQueryResp> {
    if (queryString === "**/*") {
      const resp = (await this.client.filesListFolder({
        path: ""
      })) as ListFolderResultSimple;
      const data = resp.entries.map(ent => fileToNote(ent));
      return makeResponse<NodeQueryResp>({ data: data, error: null });
    } else {
      throw `unsupported ${queryString}`;
    }
  }

  async write(_scope: Scope, _node: IDNode) {
    throw Error("not implemented");
    return;
  }
}

// dbx
//   .filesListFolder({ path: "" })
//   .then(function(response) {
//     console.log(response);
//   })
//   .catch(function(error) {
//     console.log(error);
//   });
