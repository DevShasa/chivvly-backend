import {
    Html,
    Head,
    Preview,
    Body,
    Container, Section, Hr, 
    Text,
    Link,

}from "@react-email/components"
import * as React from 'react';
import {
    body,
    container,
    sectionPadding,
    headerText,
    hr,
    paragrapText,
    link,
    code,

} from "../globalStyles"
import { section } from "../globalStyles";

export const divvlyAdminInvite = ()=>(
        <Html>
            <Head />
            <Preview>You have been invited as an admin on the divvly platform</Preview>
            <Body style={body}>
                <Container style={container}>
                    <Section style={sectionPadding}>
                        <Text style={headerText}>
                            Hello {`{{user_name}}`} You have been invited as an admin on the divvly platform
                        </Text>
                        <Hr style={hr}/>
                        <Text style={paragrapText}>
                            You have been invited to become an admin on the divvly platform,
                            head over to {" "}
                            <Link 
                                style={link}
                                href={`{{invite_link}}`}
                            >
                                {`{{invite_link}}`}
                            </Link>
                            {" "}to create your account
                        </Text>
                        <Text style={paragrapText}>
                            Or use the following credentials in the signup form on divvly:
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Email: <code style={code}>{`{{email}}`}</code>
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Invite Code: <code style={code}>{`{{invite_code}}`}</code>
                        </Text>
                        <Text style={{...paragrapText, fontSize:"14px"}}>
                            Your initial password is: <code style={code}>{`{{password}}`}</code>
                        </Text>
                    </Section>
                    <Section style={{...sectionPadding, textAlign:"center"}}>
                        <Text style={{
                            padding:"10px",
                            borderRadius:"10px",
                            backgroundColor:"gray",
                            color:"white",
                        }}>
                            This invite code is only valid for 7 days
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
)
export default divvlyAdminInvite


