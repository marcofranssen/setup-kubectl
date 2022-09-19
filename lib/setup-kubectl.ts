import { platform, arch } from "os";
import { dirname } from "path";
import { chmod, mkdir, rename } from "fs/promises";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import fetch from "node-fetch";
import { mapOS, mapArch, download } from "./utils";
import { setupKrew } from "./krew";

export async function setupKubectl() {
  try {
    const kubectlVersion = await getVersion(core.getInput("kubectlVersion"));
    const krewPlugins = getPlugins(core.getInput("plugins"));

    core.debug(`Installing kubectl ${kubectlVersion}…`);

    const osPlatform = platform();
    const osArch = arch();
    const p = mapOS(osPlatform);
    const a = mapArch(osArch);

    const downloadURL = `https://storage.googleapis.com/kubernetes-release/release/${kubectlVersion}/bin/${p}/${a}/kubectl`;
    const checksumURL = `https://storage.googleapis.com/kubernetes-release/release/${kubectlVersion}/bin/${p}/${a}/kubectl.sha256`;

    let cachedPath = tc.find("kubectl", kubectlVersion, osArch);

    if (cachedPath) {
      core.info(`Found kubectl ${kubectlVersion} in toolcache @ ${cachedPath}`);
    } else {
      core.info(`Attempting to download kubectl ${kubectlVersion}…`);
      const pathToCLI = await download(downloadURL, checksumURL);
      const dir = `${dirname(pathToCLI)}/kubectl-${kubectlVersion}`;
      await mkdir(dir, { recursive: true });
      await rename(pathToCLI, `${dir}/kubectl`);
      await chmod(`${dir}/kubectl`, 0o755);
      cachedPath = await tc.cacheDir(
        `${dir}`,
        "kubectl",
        kubectlVersion,
        osArch
      );
    }

    core.addPath(cachedPath);
    core.setOutput("kubectl-version", kubectlVersion);

    if (core.getInput("enablePlugins")) {
      await setupKrew(krewPlugins);
    }
  } catch (e) {
    core.error(e as Error);
    throw e;
  }
}

function getPlugins(plugins: string): string[] {
  return plugins.split(/,|\s/).filter((p) => p);
}

async function getVersion(version: string): Promise<string> {
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
