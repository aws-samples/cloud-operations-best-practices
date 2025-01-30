import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

import { AwsRum } from 'aws-rum-web';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  try {
    const config = {
      sessionSampleRate: 1,
      identityPoolId: "us-east-2:27bab94f-d1e8-4816-a2b1-4b744240f6e0",
      endpoint: "https://dataplane.rum.us-east-2.amazonaws.com",
      telemetries: ["performance","errors","http"],
      allowCookies: false,
      enableXRay: false
    };

    const APPLICATION_ID = '7fd9b3a4-6d10-450c-8ab6-a645ce8539c6';
    const APPLICATION_VERSION = '1.0.0';
    const APPLICATION_REGION = 'us-east-2';

    const awsRum = new AwsRum(
      APPLICATION_ID,
      APPLICATION_VERSION,
      APPLICATION_REGION,
      config
    );
  } catch (error) {
    // Ignore errors thrown during CloudWatch RUM web client initialization
  }
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/guides">
            Let's dive in!
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
