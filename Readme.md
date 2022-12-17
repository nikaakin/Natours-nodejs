# Natours Application:

https://natours-ljuy.onrender.com

## Done with:

Nodejs, MongoDB, Mongoose, parcel, pug, stripe.

## API DOC:

https://documenter.getpostman.com/view/23027399/2s8YzS1j4r

#### Some valid users to log in with:

1. email: sophie@example.com , password: test1234 ,  (role : "user")
2. email: leo@example.com , password: test1234 , (role : "guide")
3. email: steve@example.com , password: test1234 , (role : "lead-guide")
4. email: chris@example.com , password: test1234 , (role : "user")
5. email: isabel@example.com , password: test1234 , (role : "user")

##### Roles:

1. admin : can do most of the things.
2. lead-guide : can't review a tour, can post a tour, can see booking of the tour.
3. guide : can't review a tour, can't post a tour, can't see booking of the tour.
4. user : can review a tour, can buy a tour.

##### Buying a tour with stripe:

Logged in person with the role of "user" can buy a tour:
1. Click Detail button on the tour.
2. Scroll to the end of the page and click a "BOOK A TOUR" button
3. Credit-card number : 4242 4242 4242 4242
4. Expiration-date : any time in future is exceptable
5. Click pay and wait until you are rediracted to ".../my-tours" page, where you'll see all the tours you've bought

To check which tours you have bought already click avatar on header, on personal page left-side bar click "My Bookings"

##### Update password and personal data:

Logged in user can go to ".../me" route or click avatar and change email, name and photo. Alternatively can change current password too.
With the help of the API DOC (https://documenter.getpostman.com/view/23027399/2s8YzS1j4r) you can see alternative wayto change a password if user is not logged in.
