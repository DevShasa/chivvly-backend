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
    code,

} from "../globalStyles"

export const payoutSent = ()=>(
        <Html>
            <Head />
            <Preview>Payput successfully sent</Preview>
            <Body style={body}>
                <Container style={container}>
                    <Section style={sectionPadding}>
                        <Text style={headerText}>
                            Hello {`{{host_name}}`}, payout successfully sent
                        </Text>
                        <Hr style={hr}/>
                        <Text style={paragrapText}>
                            Payout has been successfully sent, the details are: 
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Withdrawal id: <code style={code}>{`{{withdrawal_id}}`}</code>
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Ammount: <code style={code}>{`{{ammount}}`}</code>
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Date: <code style={code}>{`{{date}}`}</code>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
)
export default payoutSent


