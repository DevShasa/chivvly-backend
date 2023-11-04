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

export const payoutMethodAdded = ()=>(
        <Html>
            <Head />
            <Preview>A new payout method has been added to your account</Preview>
            <Body style={body}>
                <Container style={container}>
                    <Section style={sectionPadding}>
                        <Text style={headerText}>
                            Payout method added
                        </Text>
                        <Hr style={hr}/>
                        <Text style={paragrapText}>
                            Payout method successfully added to your divvly account
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
)
export default payoutMethodAdded


