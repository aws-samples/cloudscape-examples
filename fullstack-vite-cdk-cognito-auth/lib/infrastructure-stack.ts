import * as cdk from "aws-cdk-lib";
import * as path from "node:path";
import {
  ExecSyncOptionsWithBufferEncoding,
  execSync,
} from "node:child_process";
import { Construct } from "constructs";
import { Utils } from "./utils";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cognitoIdentityPool from "@aws-cdk/aws-cognito-identitypool-alpha";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaPython from "@aws-cdk/aws-lambda-python-alpha";
import * as logs from "aws-cdk-lib/aws-logs";

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appPath = path.join(__dirname, "../user-interface");
    const buildPath = path.join(appPath, "dist");

    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
    });

    const userPool = new cognito.UserPool(this, "UserPool", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      selfSignUpEnabled: false,
      autoVerify: { email: true, phone: true },
      signInAliases: {
        email: true,
      },
    });

    const userPoolClient = userPool.addClient("UserPoolClient", {
      generateSecret: false,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
    });

    const identityPool = new cognitoIdentityPool.IdentityPool(
      this,
      "IdentityPool",
      {
        authenticationProviders: {
          userPools: [
            new cognitoIdentityPool.UserPoolAuthenticationProvider({
              userPool,
              userPoolClient,
            }),
          ],
        },
      }
    );

    const originAccessIdentity = new cf.OriginAccessIdentity(this, "S3OAI");
    websiteBucket.grantRead(originAccessIdentity);

    const lambdaArchitecture = lambda.Architecture.ARM_64;
    const powerToolsLayerVersion = "61";
    const powerToolsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "PowertoolsLayer",
      lambdaArchitecture === lambda.Architecture.X86_64
        ? `arn:${cdk.Aws.PARTITION}:lambda:${cdk.Aws.REGION}:017000801446:layer:AWSLambdaPowertoolsPythonV2:${powerToolsLayerVersion}`
        : `arn:${cdk.Aws.PARTITION}:lambda:${cdk.Aws.REGION}:017000801446:layer:AWSLambdaPowertoolsPythonV2-Arm64:${powerToolsLayerVersion}`
    );

    const xOriginVerifySecret = new secretsmanager.Secret(
      this,
      "X-Origin-Verify-Secret",
      {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        generateSecretString: {
          excludePunctuation: true,
          generateStringKey: "headerValue",
          secretStringTemplate: "{}",
        },
      }
    );

    const itemsTable = new dynamodb.Table(this, "ItemsTable", {
      partitionKey: {
        name: "itemId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiHandler = new lambdaPython.PythonFunction(this, "ApiHandler", {
      entry: path.join(__dirname, "../functions/api-handler"),
      runtime: lambda.Runtime.PYTHON_3_12,
      architecture: lambdaArchitecture,
      timeout: cdk.Duration.minutes(5),
      memorySize: 128,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [powerToolsLayer],
      environment: {
        X_ORIGIN_VERIFY_SECRET_ARN: xOriginVerifySecret.secretArn,
        ITEMS_TABLE_NAME: itemsTable.tableName,
      },
    });

    xOriginVerifySecret.grantRead(apiHandler);
    itemsTable.grantReadWriteData(apiHandler);

    const restApi = new apigateway.RestApi(this, "RestApi", {
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      cloudWatchRole: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Amz-Security-Token",
        ],
        maxAge: cdk.Duration.minutes(10),
      },
      deploy: true,
      deployOptions: {
        stageName: "api",
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        tracingEnabled: true,
        metricsEnabled: true,
        throttlingRateLimit: 2500,
      },
    });

    const cognitoAuthorizer = new apigateway.CfnAuthorizer(
      this,
      "ApiGatewayCognitoAuthorizer",
      {
        name: "CognitoAuthorizer",
        identitySource: "method.request.header.Authorization",
        providerArns: [userPool.userPoolArn],
        restApiId: restApi.restApiId,
        type: apigateway.AuthorizationType.COGNITO,
      }
    );

    const v1Resource = restApi.root.addResource("v1", {
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer: { authorizerId: cognitoAuthorizer.ref },
      },
    });

    const v1ProxyResource = v1Resource.addResource("{proxy+}");
    v1ProxyResource.addMethod(
      "ANY",
      new apigateway.LambdaIntegration(apiHandler, {
        proxy: true,
      })
    );

    const distribution = new cf.CloudFrontWebDistribution(
      this,
      "Distirbution",
      {
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        priceClass: cf.PriceClass.PRICE_CLASS_ALL,
        httpVersion: cf.HttpVersion.HTTP2_AND_3,
        originConfigs: [
          {
            behaviors: [{ isDefaultBehavior: true }],
            s3OriginSource: {
              s3BucketSource: websiteBucket,
              originAccessIdentity,
            },
          },
          {
            behaviors: [
              {
                pathPattern: "/api/*",
                allowedMethods: cf.CloudFrontAllowedMethods.ALL,
                viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                defaultTtl: cdk.Duration.seconds(0),
                forwardedValues: {
                  queryString: true,
                  headers: [
                    "Referer",
                    "Origin",
                    "Authorization",
                    "Content-Type",
                    "x-forwarded-user",
                    "Access-Control-Request-Headers",
                    "Access-Control-Request-Method",
                  ],
                },
              },
            ],
            customOriginSource: {
              domainName: `${restApi.restApiId}.execute-api.${cdk.Aws.REGION}.${cdk.Aws.URL_SUFFIX}`,
              originHeaders: {
                "X-Origin-Verify": xOriginVerifySecret
                  .secretValueFromJson("headerValue")
                  .unsafeUnwrap(),
              },
            },
          },
        ],
        errorConfigurations: [
          {
            errorCode: 404,
            errorCachingMinTtl: 0,
            responseCode: 200,
            responsePagePath: "/index.html",
          },
        ],
      }
    );

    const exportsAsset = s3deploy.Source.jsonData("aws-exports.json", {
      region: cdk.Aws.REGION,
      Auth: {
        Cognito: {
          userPoolClientId: userPoolClient.userPoolClientId,
          userPoolId: userPool.userPoolId,
          identityPoolId: identityPool.identityPoolId,
        },
      },
      API: {
        REST: {
          RestApi: {
            endpoint: `https://${distribution.distributionDomainName}/api/v1`,
          },
        },
      },
    });

    const asset = s3deploy.Source.asset(appPath, {
      bundling: {
        image: cdk.DockerImage.fromRegistry(
          "public.ecr.aws/sam/build-nodejs18.x:latest"
        ),
        command: [
          "sh",
          "-c",
          [
            "npm --cache /tmp/.npm install",
            `npm --cache /tmp/.npm run build`,
            "cp -aur /asset-input/dist/* /asset-output/",
          ].join(" && "),
        ],
        local: {
          tryBundle(outputDir: string) {
            try {
              const options: ExecSyncOptionsWithBufferEncoding = {
                stdio: "inherit",
                env: {
                  ...process.env,
                },
              };

              execSync(`npm --silent --prefix "${appPath}" ci`, options);
              execSync(`npm --silent --prefix "${appPath}" run build`, options);
              Utils.copyDirRecursive(buildPath, outputDir);
            } catch (e) {
              console.error(e);
              return false;
            }

            return true;
          },
        },
      },
    });

    new s3deploy.BucketDeployment(this, "UserInterfaceDeployment", {
      prune: false,
      sources: [asset, exportsAsset],
      destinationBucket: websiteBucket,
      distribution,
    });

    // ###################################################
    // Outputs
    // ###################################################
    new cdk.CfnOutput(this, "UserInterfaceDomainName", {
      value: `https://${distribution.distributionDomainName}`,
    });
  }
}
