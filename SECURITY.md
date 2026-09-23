# Security

Please [report a vulnerability privately](https://github.com/PostHog/twig-components/security/advisories/new). Do not put exploit details in a public issue.

The replay teaching component records the current browser tab only after someone starts it. Input values are masked by default; the lab can intentionally show search text when a user turns masking off. Recordings stay in tab memory. Use it only on Twig's fictional demo pages, never on pages with real visitor or account data.

After the first release, package updates require a reviewed change, passing checks, and a manually started npm publish workflow. Do not add npm publish tokens to this repository.
