import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'

export const POST = async(req: Request) => {
  try {
    const { username, password } = await req.json()
    if (await prisma.user.findUnique({ where: { username } })) 
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    
    const hashed = await hash(password, 10)
    const user = await prisma.user.create({
      data: { username, password: hashed },
    })
    return NextResponse.json({ id: user.id, username: user.username, password: user.password }, { status: 201 })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
