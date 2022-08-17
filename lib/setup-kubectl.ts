import { platform, arch } from "os";
import { dirname } from "path";
import { mkdir, rename } from "fs/promises";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import fetch from "node-fetch"

export async function setupKubectl() {
  const kubectlVersion = await getVersion(core.getInput("kubectlVersion"));

  core.debug(`Installing kubectl ${kubectlVersion}…`);

  const osPlatform = platform();
  const osArch = arch();
  const p = mapOS(osPlatform);
  const a = mapArch(osArch);

  const downloadURL = `https://storage.googleapis.com/kubernetes-release/release/${kubectlVersion}/bin/${p}/${a}/kubectl`;

  const cachedPath =
    tc.find("kubectl", kubectlVersion, osArch) ||
    (await (async () => {
      const pathToCLI = await tc.downloadTool(downloadURL);
      if (!pathToCLI) {
        throw new Error(`Unable to download kubectl from ${downloadURL}`);
      }
      const dir = await mkdir(`${dirname(pathToCLI)}/kubectl-${kubectlVersion}`, {recursive: true})
      await rename(pathToCLI, `${dir}/kubectl`)
      return tc.cacheDir(`${dir}`, "kubectl", kubectlVersion, osArch);
    })());

  core.addPath(cachedPath);
  core.setOutput("kubectl-version", kubectlVersion);
}

function mapOS(os: string) : string {
  const mappings : Record<string, string> = {
    win32: "windows",
  };
  return mappings[os] || os;
}

function mapArch(arch: string) : string {
  const mappings : Record<string, string> = {
    x32: "386",
    x64: "amd64",
  };
  return mappings[arch] || arch;
}

async function getVersion(version: string) {
  const semVerRegx =
    /^v(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/;
  switch (version) {
    case "stable":
    case "latest":
      const response = await fetch(`https://dl.k8s.io/release/${version}.txt`);
      return response.text();
    default:
      if (!semVerRegx.test(version)) {
        throw new Error(
          "Version has to be valid semver (e.g. v1.24.4) or `latest` or `stable`"
        );
      }

      return version;
  }
}
