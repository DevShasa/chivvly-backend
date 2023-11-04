import {
    Html,
    Head,
    Preview,
    Body,
    Container, Section, Hr, 
    Text,
    Button,
    Link
}from "@react-email/components"
import * as React from 'react';
import {
    body,
    container,
    sectionPadding,
    headerText,
    hr,
    divvlyColor,
    textColor,
    paragrapText,
    smallText,
    link,
    button,
    section
} from "../globalStyles"

export const authCodeRequest =() =>(
    <Html>
        <Head />
        <Preview>New Auth code request</Preview>
        <Body style={body}>
            <Container style={container}>
                <Section style={sectionPadding}>
                    <Text style={headerText}>
                        Hi {`{{host_name}}`} you have a new auth code request
                    </Text>
                    <Hr style={hr}/>
                    <Text style={paragrapText}>
                        You have a new auth code request made by {`{{requester_name}}`} for {`{{vehicle_name}} {{vehicle_model}}`}, 
                        Provide the auth code by clicking the button below
                    </Text>
                </Section>
                <Section style={section}>
                    <Button
                        pX={20}
                        pY={12}
                        style={button}
                        href={`{{provide_auth_code_link}}`}
                    >
                        Provide Auth code
                    </Button>
                </Section>
                <Section style={sectionPadding}>
                <Text style={smallText}>
                    Or copy and paste this link into your browser: {`  `}
                    <Link
                        style={link}
                        href={`{{provide_auth_code_link}}`}
                    >
                        {`{{provide_auth_code_link}}`}
                    </Link>
                </Text>
                </Section>
            </Container>
        </Body>
    </Html>
)

export default authCodeRequest