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

export const paymentSuccess = ()=>(
        <Html>
            <Head />
            <Preview>Payment successful</Preview>
            <Body style={body}>
                <Container style={container}>
                    <Section style={sectionPadding}>
                        <Text style={headerText}>
                            Hello {`{{user_name}}`}, this is to confirm successful payment
                        </Text>
                        <Hr style={hr}/>
                        <Text style={paragrapText}>
                            The details of the payment are: 
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Ammount: <code style={code}>{`{{ammount}}`}</code>
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Date: <code style={code}>{`{{date}}`}</code>
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Vehicle id: <code style={code}>{`{{vehicle_id}}`}</code>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
)
export default paymentSuccess


