import {
    Html,
    Head,
    Preview,
    Body,
    Container, Section, Hr, 
    Text,

}from "@react-email/components"
import * as React from 'react';
import {
    body,
    container,
    sectionPadding,
    headerText,
    hr,
    paragrapText,

} from "../globalStyles"

export const divvlyWelcomeEmail = ()=>(
        <Html>
            <Head />
            <Preview>Welcome to divvly!</Preview>
            <Body style={body}>
                <Container style={container}>
                    <Section style={sectionPadding}>
                        <Text style={headerText}>
                            Hello, welcome to divvly!
                        </Text>
                        <Hr style={hr}/>
                        <Text style={paragrapText}>
                            We are delighted to welcome you to Divvly, your one-stop destination for hassle-free car rental services. We are thrilled to have you onboard and look forward to making your car rental experience a seamless one.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
)
export default divvlyWelcomeEmail


