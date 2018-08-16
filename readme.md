# lc-deploy

Deployment tool for lc.

## Example

### Request

```shell
curl -F 'build=@./build.tar' \
     -F 'name=build_name' \   
     -F 'branch=branch_name' \   
     -F 'secret=secret' \
http://localhost:8000
```

### Config

```js
module.exports = {
    port: 8000, # server port
    secret: 'secret', # secret
    strip_components: 0, # tar strip components
    branch_to_path: { # branches and deploy paths
        "master": "./master-deploy", 
        "dev": "./dev-deploy"
    }
};
```