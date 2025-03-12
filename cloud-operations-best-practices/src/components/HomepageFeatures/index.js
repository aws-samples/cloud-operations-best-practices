import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Guides',
    Svg: require('@site/static/img/guide.svg').default,
    description: (
      <>
        Best Practice Guides were designed from the ground up to be easily followed and implemented, getting your cloud operations up and running quickly.
      </>
    ),
    link: '/docs/guides',
  },
  {
    title: 'Solutions',
    Svg: require('@site/static/img/tools.svg').default,
    description: (
      <>
       Streamline your AWS cloud operations with purpose-built solutions.
      </>
    ),
    link: '/docs/tools/',
  },
  {
    title: 'Recipes',
    Svg: require('@site/static/img/recipes.svg').default,
    description: (
      <>
        Implement proven AWS cloud operations patterns to quickly solve common challenges.
      </>
    ),
    link: '/docs/recipes',
  },
  {
    title: 'FAQs',
    Svg: require('@site/static/img/faq.svg').default,
    description: (
      <>
        Find quick answers to common AWS cloud operations questions, clarifying key concepts and best practices.
      </>
    ),
    link: '/docs/faq/',
  },
  {
    title: 'Resources',
    Svg: require('@site/static/img/signals.svg').default,
    description: (
      <>
        Access resources related to AWS Cloud Operations Best Practices, such as interactive demos, YouTube videos, and more.
      </>
    ),
    link: '/docs/resources/',
  },
  {
    title: 'Observability',
    Svg: require('@site/static/img/observability.svg').default,
    description: (
      <>
        Learn about AWS Observability Best Practices.
      </>
    ),
    link: 'https://aws-observability.github.io/observability-best-practices/',
  },
];

function Feature({Svg, title, description, link}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Link to={link}>
          <Svg className={styles.featureSvg} role="img" />
        </Link>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}