const path = require('path');
const fs = require("fs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const buildDir = path.join(__dirname, "../../", "dist");

const entries = {};

var listOfWebpackEntryFiles = [
    path.join(__dirname, './finsemble.webpack.json')
];

let componentsToBuild = {};
listOfWebpackEntryFiles.forEach(function (filename) {
    let entries = fs.existsSync(filename) ? require(filename) : {};
    let additionalComponents = {};
    if (Array.isArray(entries)) {
        // Process arrays (finsemble.webpack.json files) by automatically building the output & entry fields that webpack needs
        entries.forEach(function (assetName) {

            let assetNoSuffix = assetName.replace(/(?=\.).*/, ""); // Remove the .js or .jsx extension
            additionalComponents[assetName] = {
                output: assetNoSuffix,
                entry: "./" + assetName
            };
        });
    } else {
        // Otherwise assume it's already in object format (webpack.components.entries.json)
        additionalComponents = entries;
    }

    componentsToBuild = Object.assign(componentsToBuild, additionalComponents);
});

for (let key in componentsToBuild) {
    let component = componentsToBuild[key];
    entries[component.output] = component.entry;
}



module.exports = {
    devtool: 'source-map',
    entry: entries,
    mode: "development",

    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: [/node_modules/, "/chartiq/"],
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: ['@babel/plugin-transform-async-to-generator']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(html)$/,
                use: {
                    loader: 'html-loader',
                }
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ["file-loader"]
            }
        ]
    },
    output: {
        filename: "[name].js",
        sourceMapFilename: "[name].map.js",
        path: path.resolve(__dirname, '../../dist/')
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: "src/components/**/*.html", to: "./", flatten: false },
            { from: "src/components/**/*.jpg", to: "./", flatten: false },
            { from: "src/components/**/*.css", to: "./", flatten: false },
            { from: "src/components/**/*.json", to: "./", flatten: false },
            { from: "src/components/**/*.png", to: "./", flatten: false },
            { from: "assets/**", to: "./", flatten: false },
            { from: "config/config-examples.json", to: "./" },
            { from: "./manifest-local.json", to: "./" },
            { from: "src/components/**/*.exe", to: "./"}
        ])
    ],
    devServer: {
        contentBase: buildDir,
        host: "0.0.0.0",
        port: 8000,
        headers: {
            "Access-Control-Allow-Origin": "http://fpe-staging.finsemble.com",
            "Access-Control-Allow-Credentials": "true"
        }
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json', 'scss', 'html'],
        modules: [
            './node_modules'
        ],
    }
};