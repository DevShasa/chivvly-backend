import 'dotenv/config'
import notifications from 'src/notifications'
import "../../notifications/listeners";



(async()=>{
    notifications.sendAuthCodeRequestDeniedNotification({
        data: {
            message: `Your request to login to get an authcode was denied`,
        },
        user_id: 'user_id'
    })

    setTimeout(()=>{
        console.log("Its been 10 seconds")
    }, 10000)
})()