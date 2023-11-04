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

export const reservationReminder = ()=>(
        <Html>
            <Head />
            <Preview>Divvly reservation reminder</Preview>
            <Body style={body}>
                <Container style={container}>
                    <Section style={sectionPadding}>
                        <Text style={headerText}>
                            A reminder about your divvly reservation
                        </Text>
                        <Hr style={hr}/>
                        <Text style={paragrapText}>
                            This is to remind you of your upcoming reservation with the following details: 
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Reservation Id: <code style={code}>{`{{reservation_id}}`}</code>
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Vehicle Make: <code style={code}>{`{{vehicle_make}}`}</code>
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Vehicle Model: <code style={code}>{`{{vehicle_model}}`}</code>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
)
export default reservationReminder


