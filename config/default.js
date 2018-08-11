module.exports = {
    port: 8000,
    secret: '',
    auth_token: '',
    strip_components: 0,
    branch_to_path: {
        "master": "./master-deploy",
        "dev": "./dev-deploy"
    }
};
