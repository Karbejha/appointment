export class Member {
    id: number = 0
    username: string | null = null
    password: string | null = null
    email: string | null = null
    phone: string | null = null
    address: string | null = null

    constructor(id: number, username: string, password: string) {
        this.id = id
        this.username = username
        this.password = password
        this.email = this.email
        this.phone = this.phone
        this.address = this.address
    }
}