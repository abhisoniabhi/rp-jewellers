import { Phone, Mail, MapPin } from "lucide-react";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import rpLogo from "@assets/Pasted-There-should-be-obtion-to-add-products-in-all-collection-cards-of-admin-panel-12-minutes-ago-MK-ab-1743189201701.txt";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-100">
        <div className="container mx-auto px-3 py-3 pb-24">
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex flex-col items-center mb-6">
              <img 
                src={rpLogo} 
                alt="RP Jewellers Logo" 
                className="h-24 w-24 object-contain mb-3 rounded-full border-4 border-amber-300 p-1 shadow-lg" 
              />
              <h1 className="text-2xl font-bold text-amber-800 text-center">About RP Jewellers</h1>
            </div>
            
            <div className="prose prose-amber max-w-none">
              <p>
                RP Jewellers is a premier jewelry shop specializing in exquisite gold and silver ornaments. 
                Established with a commitment to quality and craftsmanship, we have been serving our 
                customers with the finest jewelry pieces for over two decades.
              </p>
              
              <p>
                Our collection includes traditional and contemporary designs that cater to various 
                preferences and occasions. From wedding collections to everyday wear, we offer a wide 
                range of options to choose from.
              </p>
              
              <h2 className="text-xl font-semibold text-amber-700 mt-6 mb-3">Our Values</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Quality Assurance - All our products are BIS hallmarked</li>
                <li>Transparency - We maintain clear pricing with no hidden charges</li>
                <li>Craftsmanship - Each piece is meticulously crafted by skilled artisans</li>
                <li>Customer Satisfaction - Your happiness is our top priority</li>
              </ul>
              
              <h2 className="text-xl font-semibold text-amber-700 mt-6 mb-3">Visit Us</h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin className="text-amber-600 h-5 w-5 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">RP Jewellers</p>
                    <p>123 Main Street, Jewelry Market</p>
                    <p>New Delhi, India - 110001</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="text-amber-600 h-5 w-5 mr-2" />
                  <p>+91 98765 43210</p>
                </div>
                
                <div className="flex items-center">
                  <Mail className="text-amber-600 h-5 w-5 mr-2" />
                  <p>contact@rpjewellers.com</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold text-amber-700 mb-3">Business Hours</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>Monday - Saturday:</div>
              <div>10:00 AM - 8:00 PM</div>
              <div>Sunday:</div>
              <div>11:00 AM - 6:00 PM</div>
            </div>
          </div>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}