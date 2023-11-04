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

export const withdrawAprooved = ()=>(
        <Html>
            <Head />
            <Preview>Withdrawal has been approoved</Preview>
            <Body style={body}>
                <Container style={container}>
                    <Section style={sectionPadding}>
                        <Text style={headerText}>
                            Your withdrawal request has been Successfully Approved
                        </Text>
                        <Hr style={hr}/>
                        <Text style={paragrapText}>
                            The details of your withdrawal are:
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Withdrawal Id: <code style={code}>{`{{withdraw_id}}`}</code>
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Withdrawal Ammount: <code style={code}>{`{{withdraw_ammount}}`}</code>
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Withdrawal Date: <code style={code}>{`{{withdraw_date}}`}</code>
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Payout Method: <code style={code}>{`{{payout_method}}`}</code>
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Payout Method ID: <code style={code}>{`{{payout_method_id}}`}</code>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
)
export default withdrawAprooved


