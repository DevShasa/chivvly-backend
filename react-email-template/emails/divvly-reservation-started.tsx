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

export const reservationStarted =() =>(
    <Html>
        <Head />
        <Preview>A reservation has started</Preview>
        <Body style={body}>
            <Container style={container}>
                <Section style={sectionPadding}>
                    <Text style={headerText}>
                        Hello,  {`{{host_name}}`}, a reservation has started
                    </Text>
                    <Hr style={hr}/>
                    <Text style={paragrapText}>
                        A reservation has started, the reservation details are: 
                    </Text>
                    <Text style={{...paragrapText, fontSize:"14px"}}>
                        Vehicle Name: <code style={code}>{`{{vehicle_name}}`}</code>
                    </Text>
                    <Text style={{...paragrapText, fontSize:"14px"}}>
                        Vehicle Model: <code style={code}>{`{{vehicle_model}}`}</code>
                    </Text>
                    <Text style={{...paragrapText, fontSize:"14px"}}>
                        Auth Code: <code style={code}>{`{{auth_code}}`}</code>
                    </Text>
                    <Text style={{...paragrapText, fontSize:"14px"}}>
                        Client Name: <code style={code}>{`{{client_name}}`}</code>
                    </Text>
                </Section>
            </Container>
        </Body>
    </Html> 
)
export default reservationStarted