import { platform, arch, homedir } from "os";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import { mapOS, mapArch, download } from "./utils";
import { exec } from "child_process";

export async function setupKrew(plugins: string[]) {
  const osPlatform = platform();
  const osArch = arch();
  const p = mapOS(osPlatform);
  const a = mapArch(osArch);

  let krewVersion = "latest";
  const binary = `krew-${p}_${a}`;
  const archive = `${binary}.tar.gz`;
  const downloadURL = `https://github.com/kubernetes-sigs/krew/releases/${krewVersion}/download/${archive}`;
  const checksumURL = `${downloadURL}.sha256`;

  let cachedPath = tc.find("krew", krewVersion, osArch);
  if (cachedPath) {
    core.info(`Found kubectl ${krewVersion} in toolcache @ ${cachedPath}`);
  } else {
    core.info(`Attempting to download krew ${krewVersion}…`);
    const pathToCLIArchive = await download(downloadURL, checksumURL);
    const pathToCLI = await tc.extractTar(pathToCLIArchive);
    cachedPath = await tc.cacheDir(pathToCLI, "krew", krewVersion, a);
  }

  krewVersion = await installKrew(cachedPath, binary);
  core.setOutput("krew-version", krewVersion);

  const installedPlugins = await installPlugins(cachedPath, binary, plugins);
  core.setOutput("krew-plugins", JSON.stringify(installedPlugins));
}

function installKrew(cachedPath: string, binary: string): Promise<string> {
  return new Promise((resolve, reject) => {
    core.addPath(`${homedir()}/.krew/bin`);
    exec(`${cachedPath}/${binary} install krew`, (e) => {
      if (e) {
        return reject(e);
      }

      exec(`${cachedPath}/${binary} krew version`, (e, stdout) => {
        if (e) {
          return resolve("latest");
        }

        core.debug(stdout);
        const tagLine = stdout?.match(/^GitTag.*$/m);
        const version = tagLine?.[0].split(/\s+/)[1];

        resolve(version || "latest");
      });
    });
  });
}

function installPlugins(
  cachedPath: string,
  binary: string,
  plugins: string[]
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const krewBin = `${homedir()}/.krew/bin`;
    const installed: Record<string, string>[] = [];

    plugins.forEach((p) => {
      core.info(`Attempting to install plugin: ${p}…`);
      exec(`${krewBin}/kubectl-krew install ${p}`, (e) => {
        if (e) {
          return reject(e);
        }

        const pluginBin = `kubectl-${p.replace("-", "_")}`;
        exec(`${krewBin}/${pluginBin} version`, (e, stdout) => {
          if (e) {
            installed.push({ [p]: "unknown" });
          }

          core.debug(stdout);
          installed.push({ [p]: stdout });
        });
      });
    });

    resolve(installed);
  });
}
