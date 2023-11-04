# React Email Starter

React email is used to create the templates and provide a live preview

## Getting Started

First, install the dependencies:

```sh
npm install
# or
yarn
```

Then, run the development server:

```sh
npm run dev
# or
yarn dev
```

Open [localhost:3000](http://localhost:3000) with your browser to see the result.

## Email Preview window
A preview of the template
![react email preview desktop](https://github.com/NiebexShasa/imgpr/assets/122779090/b6e94499-fa7e-4eed-ac6a-ef9e2627cce1)


## Html window
After creating the template click source and copy the raw html generated, this is the template that will be passed into postmark 
![react-email-preview- html](https://github.com/NiebexShasa/imgpr/assets/122779090/5f52a661-6800-408d-9f03-f62066eb01f9)

## Note

When creating the template leave placeholders in the form of {{placeholder_name}}, postmark will then fill in the placeholders with the variables passed in when the template is called