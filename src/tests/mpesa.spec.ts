import mpesa from "@utils/mpesa"



describe("MPESA", ()=>{
        before(()=>{
            mpesa.setTestUrl("https://webhook.site/f20404ae-aef7-4b59-beae-57f1dfd6b0b9") // a url we can control
        })
        it("Should send out request", (done)=>{
            mpesa.requestPayment({
                amount: 5,
                phone: BigInt(process.env.MPESA_TEST_NUMBER as string)
            }).then((res)=>{
                console.log("res::", res)
                done()
            }).catch((e)=>{
                console.log("An error occured::", e)
                done(e)
            })
        }).timeout(60000)

        it("Should send out a paout request", (done)=>{
            mpesa.sendPayout({
                amount: 5,
                phone: BigInt(process.env.MPESA_TEST_NUMBER as string)
            }).then((res)=>{
                console.log("res::", res)
                done()
            }).catch((e)=>{
                console.log("An error occured::", e)
                done(e)
            })
        }).timeout(60000)

})