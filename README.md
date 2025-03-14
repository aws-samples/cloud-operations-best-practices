# AWS Cloud Operations Best Practices

## Welcome

This is the source for the [AWS Cloud Operations Best Practices site](https://aws-samples.github.io/cloud-operations-best-practices/). Everyone is welcome to contribute here, not just AWS employees!

## How to run/develop this site

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator. You need to install [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) as a prerequisite.

### Installation

```
cd cloud-operations-best-practices
$ (yarn | npm ) install
```

### Local Development

```
$ yarn start [or] npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

**Note:** You may need to run the following command to install the AWS RUM module.

```
npm install aws-rum-web
```

### Build

```
$ yarn build [or] npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH with yarn:
```
$ USE_SSH=true yarn deploy 
```

Using SSH with npm:
```
$ USE_SSH=true  npm run serve
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.



## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
