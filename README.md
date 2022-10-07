# Setup kubectl

This Github action installs [kubectl][] and allows to optionally also install [krew][] to manage [kubectl plugins][krew-plugins]. You can also choose to pre-install a bunch of kubectl plugins by default.

## Usage

### Install stable

Installs the latest `stable` release.

```yaml
steps:
  - uses: marcofranssen/setup-kubectl@v0.3.0
    id: kubectl
  - run: echo ${{ steps.kubectl.output.kubectl-version }}
```

### Install latest

Installs the `latest` release.

```yaml
steps:
  - uses: marcofranssen/setup-kubectl@v0.3.0
    id: kubectl
    with:
      kubectl-version: latest
  - run: echo ${{ steps.kubectl.output.kubectl-version }}
```

### Install specific version

Installs the `v1.24.5` release.

```yaml
steps:
  - uses: marcofranssen/setup-kubectl@v0.3.0
    id: kubectl
    with:
      kubectl-version: v1.24.5
```

### Install krew

Install `krew` allong with kubectl.

```yaml
steps:
  - uses: marcofranssen/setup-kubectl@v0.3.0
    with:
      enable-plugins: true
  - run: echo ${{ steps.kubectl.output.krew-version }}
  - run: kubectl krew install aws-auth
```

### Install plugins

Install `krew` allong with `kubectl` and some plugins.

```yaml
steps:
  - uses: marcofranssen/setup-kubectl@v0.3.0
    with:
      enable-plugins: true
      plugins: aws-auth,grep
  - run: echo ${{ steps.kubectl.output.krew-version }}
  - run: echo ${{ fromJson(steps.kubectl.output.krew-plugins) }}
  - run: kubectl aws-auth version
```

[kubectl]: https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/ "The Kubernetes CLI"
[krew]: https://krew.sigs.k8s.io/ "Krew is the plugin manager for kubectl command-line tool."
[krew-plugins]: https://krew.sigs.k8s.io/plugins/ "List of kubectl plugins distributed on the centralized krew-index."
