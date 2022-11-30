import { IFiber, IRef } from './type'
import { updateElement } from './dom'
import { isFn, TAG } from './reconcile'

export const commit = (fiber: IFiber): void => {
  let current = fiber.next
  fiber.next = null
  do {
    op(current)
  } while ((current = current.next))
}

const op = (fiber: any) => {
  if (fiber.lane & TAG.NOWORK) {
    return
  }
  if (fiber.lane === TAG.REMOVE) {
    remove(fiber)
    return
  }
  if (fiber.lane & TAG.INSERT) {
    if (fiber.isComp) {
      fiber.child.lane = fiber.lane
      op(fiber.child)
      fiber.child.lane |= TAG.NOWORK
    } else {
      fiber.parentNode.insertBefore(fiber.node, fiber.after || null)
    }
  }
  if (fiber.lane & TAG.UPDATE) {
    if (fiber.isComp) {
      fiber.child.lane = fiber.lane
      op(fiber.child)
      fiber.child.lane |= TAG.NOWORK
    } else {
      updateElement(fiber.node, fiber.oldProps || {}, fiber.props)
    }
  }

  refer(fiber.ref, fiber.node)
}

const refer = (ref: IRef, dom?: HTMLElement): void => {
  if (ref)
    isFn(ref) ? ref(dom) : ((ref as { current?: HTMLElement })!.current = dom)
}

const kidsRefer = (kids: any): void => {
  kids.forEach(kid => {
    kid.kids && kidsRefer(kid.kids)
    refer(kid.ref, null)
  })
}

const remove = d => {
  if (d.isComp) {
    d.hooks && d.hooks.list.forEach(e => e[2] && e[2]())
    d.kids.forEach(remove)
  } else {
    kidsRefer(d.kids)
    d.parentNode.removeChild(d.node)
    refer(d.ref, null)
  }
}