import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/marketplace',
      name: 'MarketPlace',
      component: () => import('../views/MarketPlace.vue')
    },
    {
      path: '/nft/:contractAddress/:tokenId?',
      name: 'NftDetail',
      component: () => import('../views/NftDetail.vue')
    },
    {
      path: '/create-collection',
      name: 'CreateCollection',
      component: () => import('../views/CreateCollection.vue')
    },
    {
      path: '/create-nft',
      name: 'CreateNft',
      component: () => import('../views/CreateNft.vue')
    }
  ]
})

export default router 