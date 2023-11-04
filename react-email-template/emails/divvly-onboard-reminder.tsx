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
    section,
    code
} from "../globalStyles"

export const onboardReminder =() =>(
    <Html>
        <Head />
        <Preview>A reservation has started</Preview>
        <Body style={body}>
            <Container style={container}>
                <Section style={sectionPadding}>
                    <Text style={headerText}>
                        Hello,  {`{{user_name}}`}, remember to complete your onboarding
                    </Text>
                    <Hr style={hr}/>
                    <Text style={paragrapText}>
                        Complete your onboarding in order to use Divvly services, by clicking the button below
                    </Text>
                </Section>
                <Section style={section}>
                    <Button
                        pX={20}
                        pY={12}
                        style={button}
                        href={`{{onboarding_link}}`}
                    >
                        Complete onboarding
                    </Button>
                </Section>
                <Text style={smallText}>
                    Or copy and paste this link into your browser: {`  `}
                    <Link
                        style={link}
                        href={`{{onboarding_link}}`}
                    >
                        {`{{onboarding_link}}`}
                    </Link>
                </Text>
            </Container>
        </Body>
    </Html> 
)
export default onboardReminder